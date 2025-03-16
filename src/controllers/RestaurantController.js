const RestaurantService = require('../services/restaurantService');

const restaurantController = {
  getAllRestaurants: async (req, res) => {
    try {
      const restaurants = await RestaurantService.getAllRestaurants();
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = restaurantController;