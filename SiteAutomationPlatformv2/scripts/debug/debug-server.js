import express from 'express';
import imageRoutes from './src/routes/imageRoutes.js';

const app = express();
app.use(express.json());

console.log('Setting up routes...');

// Test basic route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Test the problematic route directly
app.post('/list-sites', (req, res) => {
  console.log('🔍 /list-sites hit - WORKING!');
  res.json([{ site: 'test-site' }]);
});

// Mount image routes
console.log('Mounting image routes...');
app.use('/images', imageRoutes);

// Add debug route to list all routes
app.get('/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      routes.push({
        method: Object.keys(r.route.methods)[0].toUpperCase(),
        path: r.route.path
      });
    }
  });
  res.json(routes);
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Debug server listening at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('GET /test');  
  console.log('POST /list-sites');
  console.log('GET /debug-routes');
  console.log('ALL /images/*');
});