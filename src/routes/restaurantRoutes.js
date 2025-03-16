const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/RestaurantController');

router.get('/', restaurantController.getAllRestaurants);

module.exports = router;