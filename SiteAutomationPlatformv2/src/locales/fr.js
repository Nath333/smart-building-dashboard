// French translations for the entire application
export const fr = {
  // Navigation
  nav: {
    tabs: {
      siteInfo: '1 INFO SITE',
      equipment: '2 ÉQUIPEMENTS',
      visualPlan: '3 PLAN VISUEL',
      quote: '4 DEVIS',
      gtbConfig: '5 CONFIG GTB'
    }
  },

  // Common UI elements
  common: {
    save: 'Enregistrer les données',
    reset: 'Réinitialiser cette page',
    cancel: 'Annuler',
    delete: 'Supprimer',
    add: 'Ajouter',
    edit: 'Modifier',
    upload: 'Télécharger',
    download: 'Télécharger',
    close: 'Fermer',
    previous: 'Précédent',
    next: 'Suivant',
    loading: 'Chargement...',
    saving: 'Sauvegarde en cours...',
    noData: 'Aucune donnée',
    noSelection: 'Aucune sélection',
    search: 'Rechercher',
    confirm: 'Confirmer',
    success: 'Succès',
    error: 'Erreur',
    warning: 'Attention',
    info: 'Information'
  },

  // Messages
  messages: {
    saveSuccess: 'Données sauvegardées avec succès',
    deleteSuccess: 'Données supprimées avec succès',
    uploadSuccess: 'Téléchargement réussi',
    resetSuccess: 'Page réinitialisée',
    saveError: 'Erreur lors de la sauvegarde',
    deleteError: 'Erreur lors de la suppression',
    uploadError: 'Erreur lors du téléchargement',
    loadError: 'Erreur lors du chargement des données',
    formError: 'Veuillez remplir tous les champs requis',
    siteLoadSuccess: 'Données chargées pour "{site}"'
  },

  // Page 1 - Site Info
  siteInfo: {
    title: 'Informations du site',
    formTitle: 'Formulaire Utilisateur',
    isNewSite: 'Est-ce un nouveau site ?',
    yes: 'Oui',
    no: 'Non',
    selectExisting: 'Sélectionner un site existant',
    searchPlaceholder: 'Rechercher un site existant',
    siteSection: 'Informations du Site',
    fields: {
      siteName: 'Nom du site',
      clientName: 'Nom du client',
      address: 'Adresse',
      phone1: 'Téléphone 1',
      phone2: 'Téléphone 2 (optionnel)',
      email: 'Email'
    },
    placeholders: {
      siteName: 'Nom du site',
      clientName: 'Nom du client',
      address: 'Adresse complète',
      phone1: 'Téléphone principal',
      phone2: 'Téléphone secondaire',
      email: 'Adresse email'
    },
    validations: {
      siteRequired: 'Veuillez entrer le nom du site',
      phoneInvalid: 'Numéro invalide (10 à 15 chiffres)',
      emailInvalid: 'Adresse email invalide'
    }
  },

  // Page 2 - Equipment
  equipment: {
    title: 'Équipements du site',
    byZone: 'Équipements par zone',
    addZone: 'Ajouter une zone',
    noCards: 'Aucune carte configurée. Cliquez sur "Ajouter une zone" pour commencer.',
    categories: {
      aero: 'Aérothermes',
      clim: 'Climatisation',
      rooftop: 'Rooftop',
      eclairage: 'Éclairage'
    },
    zones: {
      general: 'Général',
      salesArea: 'Surface de vente',
      office: 'Bureau',
      warehouse: 'Entrepôt',
      reception: 'Accueil'
    },
    fields: {
      // Aero fields
      zoneAerotherme: 'Zone aérotherme',
      nbAerotherme: 'Nombre d\'aérothermes',
      thermostatAerotherme: 'Thermostat aérotherme',
      nbContactsAerotherme: 'Nombre de contacts',
      coffretAerotherme: 'Coffret aérotherme',
      coffretHorlogeAerotherme: 'Coffret horloge',
      typeAerotherme: 'Type d\'aérotherme',
      fonctionementAerotherme: 'Fonctionnement',
      maintenanceAerotherme: 'Maintenance',
      commentaireAero: 'Commentaire',
      marqueAerotherme: 'Marque aérotherme',

      // Clim fields
      zoneClim: 'Zone climatisation',
      nbClimIr: 'Nombre de clim IR',
      nbClimWire: 'Nombre de clim filaire',
      coffretClim: 'Coffret climatisation',
      typeClim: 'Type de climatisation',
      fonctionementClim: 'Fonctionnement',
      maintenanceClim: 'Maintenance',
      nbTelecommandeClimSmartwire: 'Nb télécommande smartwire',
      nbTelecommandeClimWire: 'Nb télécommande filaire',
      commentaireClim: 'Commentaire',
      climIrRef: 'Référence clim IR',
      climWireRef: 'Référence clim filaire',

      // Rooftop fields
      zoneRooftop: 'Zone rooftop',
      nbRooftop: 'Nombre de rooftops',
      thermostatRooftop: 'Thermostat rooftop',
      telecommandeModbusRooftop: 'Télécommande Modbus',
      coffretRooftop: 'Coffret rooftop',
      typeRooftop: 'Type de rooftop',
      fonctionementRooftop: 'Fonctionnement',
      maintenanceRooftop: 'Maintenance',
      commentaireRooftop: 'Commentaire',
      marqueRooftop: 'Marque rooftop',

      // Eclairage fields
      eclairageInterieur: 'Éclairage intérieur',
      eclairageContacteur: 'Contacteur d\'éclairage',
      eclairageExterieur: 'Éclairage extérieur',
      eclairageHorloge: 'Horloge d\'éclairage',
      commentaireEclairage: 'Commentaire'
    }
  },

  // Page 3 - Visual Plan
  visualPlan: {
    title: 'Plan visuel',
    uploadImage: 'Télécharger une image',
    cropImage: 'Recadrer l\'image',
    addIcons: 'Ajouter des icônes',
    legend: 'Légende',
    noImage: 'Aucune image téléchargée',
    dragInstructions: 'Faites glisser les icônes pour les positionner sur le plan',
    removeImage: 'Supprimer l\'image',
    saveLayout: 'Enregistrer la disposition'
  },

  // Page 4 - Quote/Devis
  quote: {
    title: 'Devis',
    generateQuote: 'Générer le devis',
    exportPdf: 'Exporter en PDF',
    exportExcel: 'Exporter en Excel',
    items: 'Articles',
    quantity: 'Quantité',
    unitPrice: 'Prix unitaire',
    total: 'Total',
    subtotal: 'Sous-total',
    tax: 'TVA',
    grandTotal: 'Total TTC'
  },

  // Page 5 - GTB Config
  gtbConfig: {
    title: 'Configuration GTB',
    modules: 'Modules',
    sensors: 'Capteurs',
    selectModules: 'Sélectionner les modules',
    moduleQuantity: 'Quantité de modules',
    references: 'Références',
    configuration: 'Configuration',
    moduleTypes: {
      aeroeau: 'Aérotherme eau',
      aerogaz: 'Aérotherme gaz',
      climIr: 'Climatisation IR',
      climFilaireSimple: 'Clim filaire simple',
      climFilaireGroupe: 'Clim filaire groupe',
      rooftop: 'Rooftop',
      comptageFroid: 'Comptage froid',
      comptageEclairage: 'Comptage éclairage',
      eclairage: 'Éclairage',
      sondes: 'Sondes',
      sondesPresentes: 'Sondes présentes',
      gazCompteur: 'Compteur gaz',
      izit: 'Izit'
    }
  },

  // Zone Management Modal
  zoneModal: {
    title: 'Gestion des zones',
    selectType: 'Sélectionner le type d\'équipement',
    selectZone: 'Sélectionner la zone',
    addCard: 'Ajouter la carte',
    existingCards: 'Cartes existantes',
    noCards: 'Aucune carte configurée',
    removeCard: 'Supprimer la carte',
    cardAdded: 'Carte ajoutée avec succès',
    cardRemoved: 'Carte supprimée avec succès',
    selectBoth: 'Veuillez sélectionner le type et la zone'
  },

  // Image Cropper
  imageCropper: {
    title: 'Recadrer l\'image',
    upload: 'Télécharger une image',
    crop: 'Recadrer',
    reset: 'Réinitialiser',
    rotate: 'Rotation',
    zoom: 'Zoom',
    confirm: 'Confirmer',
    cancel: 'Annuler'
  },

  // Polygon Editor
  polygonEditor: {
    title: 'Éditeur de polygones',
    addPolygon: 'Ajouter un polygone',
    deletePolygon: 'Supprimer le polygone',
    editPolygon: 'Modifier le polygone',
    selectColor: 'Sélectionner la couleur',
    drawInstructions: 'Cliquez sur la carte pour dessiner un polygone',
    finishDrawing: 'Terminer le dessin',
    clearAll: 'Tout effacer'
  }
};

export default fr;
