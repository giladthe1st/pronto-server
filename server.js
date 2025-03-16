require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Use the combined routes with '/api' prefix
app.use('/api', routes); // This is the key fix

// Start server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});