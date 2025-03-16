const express = require('express');
const router = express.Router();

const restaurantRoutes = require('./restaurantRoutes');

// Combine all routes
router.use('/restaurants', restaurantRoutes);
// Add other routes

module.exports = router;