import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:4001',
  timeout: 10000
});

async function testComprehensiveEquipment() {
  console.log('🔍 Testing comprehensive equipment setup...');
  
  const comprehensiveEquipment = {
    site: 'debug_test_site',
    zone_aerotherme: 'Zone A,Zone B,Zone C',
    nb_aerotherme: '5',
    thermostat_aerotherme: 'Smart Digital',
    coffret_aerotherme: 'Premium',
    type_aerotherme: 'Electric,Gas,Hybrid',
    Fonctionement_aerotherme: 'Automatic',
    Maintenance_aerotherme: 'Weekly',
    commentaire_aero: 'Comprehensive aerotherme setup with advanced controls',
    zone_clim: 'Office,Workshop,Storage',
    nb_clim_ir: '4',
    nb_clim_wire: '3',
    coffret_clim: 'Industrial',
    type_clim: 'Split,Central,Portable',
    Fonctionement_clim: 'Intelligent',
    Maintenance_clim: 'Bi-weekly',
    commentaire_clim: 'Multi-zone climate control system',
    nb_rooftop: '2',
    thermostat_rooftop: 'Programmable',
    Eclairage_interieur: 'LED Smart',
    Eclairage_exterieur: 'Solar LED',
    commentaire_eclairage: 'Energy-efficient lighting system'
  };
  
  try {
    const response = await api.post('/save_page2', comprehensiveEquipment);
    console.log('✅ Success:', response.status);
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

async function testComplexGTB() {
  console.log('🔍 Testing complex GTB configuration...');
  
  const complexGTB = {
    site: 'debug_test_site',
    modules: ['aeroeau', 'aerogaz', 'rooftop', 'eclairage'],
    aeroeau: 5,
    aerogaz: 3,
    rooftop: 2,
    eclairage: 4,
    refs: {
      aeroeau: ['AE-001', 'AE-002', 'AE-003', 'AE-004', 'AE-005'],
      aerogaz: ['AG-001', 'AG-002', 'AG-003'],
      rooftop: ['RT-001', 'RT-002'],
      eclairage: ['EC-001', 'EC-002', 'EC-003', 'EC-004']
    },
    sondes: 8,
    sondesPresentes: 6,
    gazCompteur: 'Advanced Digital',
    Izit: 'Model Pro Max'
  };
  
  try {
    const response = await api.post('/save_page3', complexGTB);
    console.log('✅ Success:', response.status);
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  await testComprehensiveEquipment();
  await testComplexGTB();
}

run();