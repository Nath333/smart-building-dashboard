import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// The problematic route
app.post('/list-sites', async (req, res) => {
  console.log('🔍 /list-sites endpoint hit!');
  res.json([{ site: 'test-site' }]);
});

// Test image route
app.post('/images/test', async (req, res) => {
  console.log('🔍 /images/test endpoint hit!');
  res.json({ message: 'Image route working!' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server listening at http://localhost:${PORT}`);
});