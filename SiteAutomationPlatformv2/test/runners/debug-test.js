import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:4001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const TEST_SITE = `debug_site_${Date.now()}`;

async function debugTest() {
  console.log(`🔍 Debug test with site: ${TEST_SITE}\n`);

  try {
    // 1. Create site first
    console.log('1. Creating site...');
    const site1Response = await api.post('/save-page1', {
      site: TEST_SITE,
      client: 'Debug Client',
      address: 'Debug Address',
    });
    console.log('✅ Site created:', site1Response.status);

    // 2. Test simple Page 2 data
    console.log('2. Testing Page 2 with simple data...');
    const page2SimpleData = {
      site: TEST_SITE,
      nb_aerotherme: '2',
      nb_clim_ir: '1',
    };
    
    const page2Response = await api.post('/save_page2', page2SimpleData);
    console.log('✅ Page 2 simple:', page2Response.status, page2Response.data);

    // 3. Test complex Page 2 data (like in test)
    console.log('3. Testing Page 2 with complex data...');
    const page2ComplexData = {
      site: TEST_SITE,
      zone_aerotherme: ['Zone A', 'Zone B'],
      nb_aerotherme: '4',
      thermostat_aerotherme: 'Digital',
      nb_contacts_aerotherme: '2',
      coffret_aerotherme: 'Standard',
      type_aerotherme: ['Electric', 'Hybrid'],
      Fonctionement_aerotherme: 'Automatic',
      Maintenance_aerotherme: 'Quarterly',
      commentaire_aero: 'Complete test for aerotherme',
      zone_clim: ['Office A', 'Office B'],
      nb_clim_ir: '3',
      nb_clim_wire: '2',
      coffret_clim: 'Premium',
      type_clim: ['Split', 'Ducted'],
      Fonctionement_clim: 'Smart',
      Maintenance_clim: 'Monthly',
      commentaire_clim: 'Complete test for climatisation',
    };

    try {
      const page2ComplexResponse = await api.post('/save_page2', page2ComplexData);
      console.log('✅ Page 2 complex:', page2ComplexResponse.status, page2ComplexResponse.data);
    } catch (error) {
      console.log('❌ Page 2 complex failed:', error.response?.status, error.response?.data);
      console.log('Error details:', error.message);
    }

    // 4. Test Page 3 simple
    console.log('4. Testing Page 3 with simple data...');
    const page3SimpleData = {
      site: TEST_SITE,
      modules: ['aeroeau'],
      aeroeau: 1,
      refs: { aeroeau: ['AE-001'] },
    };

    try {
      const page3Response = await api.post('/save_page3', page3SimpleData);
      console.log('✅ Page 3 simple:', page3Response.status, page3Response.data);
    } catch (error) {
      console.log('❌ Page 3 failed:', error.response?.status, error.response?.data);
      console.log('Error details:', error.message);
    }

    // 5. Test position update
    console.log('5. Testing position update...');
    try {
      const posResponse = await api.put('/update-position', {
        site: TEST_SITE,
        id: 'debug-test',
        x: 100,
        y: 200,
      });
      console.log('✅ Position update:', posResponse.status);
    } catch (error) {
      console.log('❌ Position update failed:', error.response?.status, error.response?.data);
      console.log('Error details:', error.message);
    }

  } catch (error) {
    console.error('💥 Debug test failed:', error.message);
  }
}

debugTest();